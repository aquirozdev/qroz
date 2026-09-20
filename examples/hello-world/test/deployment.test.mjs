import test from "node:test"
import assert from "node:assert/strict"

import application from "../dist/app.js"
import { planDeployment } from "../../../packages/deployment/dist/index.js"
import { planAwsIam } from "../../../packages/deployment-aws/dist/index.js"
import { planCloudflareBindings } from "../../../packages/deployment-cloudflare/dist/index.js"

test("deployment plan preserves operation-level resource access and job triggers", () => {
  const plan = planDeployment(application)

  const putFile = plan.surfaces.find((surface) => surface.id === "endpoint:files.putFile")
  assert.deepEqual(putFile.resourceAccess, [{
    capability: "storage.files",
    resourceType: "object-storage",
    operations: ["write"],
    unrestricted: false,
    reason: "declared"
  }])

  const getFile = plan.surfaces.find((surface) => surface.id === "endpoint:files.getFile")
  assert.deepEqual(getFile.resourceAccess, [{
    capability: "storage.files",
    resourceType: "object-storage",
    operations: ["read"],
    unrestricted: false,
    reason: "declared"
  }])

  const dispatch = plan.surfaces.find((surface) => surface.id === "endpoint:notifications.dispatchNotification")
  assert.deepEqual(dispatch.resourceAccess, [{
    capability: "queue.jobs.notifications",
    resourceType: "message-queue",
    operations: ["publish"],
    unrestricted: false,
    reason: "job-dispatch"
  }])

  const job = plan.surfaces.find((surface) => surface.id === "job:notifications.DeliverNotification")
  assert.deepEqual(job.triggers, [{
    capability: "queue.jobs.notifications",
    resourceType: "message-queue",
    operation: "consume",
    reason: "job-transport"
  }])
  assert.ok(job.resourceAccess.some((item) =>
    item.capability === "jobs.notifications.idempotency" &&
    item.operations.join(",") === "claim,complete,release"
  ))
})

test("AWS IAM planner emits narrow S3/SQS/DynamoDB statements from Arc semantics", () => {
  const plan = planDeployment(application)
  const aws = planAwsIam(plan, {
    "storage.files": { kind: "s3", bucketArn: "arn:aws:s3:::arc-files" },
    "queue.notifications": { kind: "sqs", queueArn: "arn:aws:sqs:us-east-1:123456789012:notifications" },
    "queue.jobs.notifications": { kind: "sqs", queueArn: "arn:aws:sqs:us-east-1:123456789012:jobs" },
    "jobs.notifications.idempotency": { kind: "dynamodb", tableArn: "arn:aws:dynamodb:us-east-1:123456789012:table/idempotency" }
  })

  const putFile = aws.surfaces.find((surface) => surface.surface === "endpoint:files.putFile")
  assert.deepEqual(putFile.statements, [{
    Effect: "Allow",
    Action: ["s3:PutObject"],
    Resource: "arn:aws:s3:::arc-files/*"
  }])

  const getFile = aws.surfaces.find((surface) => surface.surface === "endpoint:files.getFile")
  assert.deepEqual(getFile.statements, [{
    Effect: "Allow",
    Action: ["s3:GetObject"],
    Resource: "arn:aws:s3:::arc-files/*"
  }])

  const dispatch = aws.surfaces.find((surface) => surface.surface === "endpoint:notifications.dispatchNotification")
  assert.deepEqual(dispatch.statements, [{
    Effect: "Allow",
    Action: ["sqs:SendMessage"],
    Resource: "arn:aws:sqs:us-east-1:123456789012:jobs"
  }])

  const job = aws.surfaces.find((surface) => surface.surface === "job:notifications.DeliverNotification")
  assert.ok(job.statements.some((statement) =>
    statement.Action.includes("dynamodb:PutItem") &&
    statement.Action.includes("dynamodb:DeleteItem")
  ))
  assert.ok(job.statements.some((statement) =>
    statement.Action.join(",") === "sqs:ReceiveMessage,sqs:DeleteMessage,sqs:GetQueueAttributes"
  ))
})

test("Cloudflare planner emits resource bindings and queue consumer triggers", () => {
  const plan = planDeployment(application)
  const cloudflare = planCloudflareBindings(plan, {
    "storage.files": { kind: "r2", binding: "FILES", bucket: "arc-files" },
    "queue.notifications": { kind: "queue", binding: "NOTIFICATIONS", queue: "notifications" },
    "queue.jobs.notifications": { kind: "queue", binding: "JOBS", queue: "jobs" },
    "jobs.notifications.idempotency": { kind: "durable-object", binding: "IDEMPOTENCY", className: "ArcIdempotency" }
  })

  const write = cloudflare.surfaces.find((surface) => surface.surface === "endpoint:files.putFile")
  assert.deepEqual(write.bindings, [{
    capability: "storage.files",
    binding: "FILES",
    kind: "r2",
    operations: ["write"]
  }])

  const job = cloudflare.surfaces.find((surface) => surface.surface === "job:notifications.DeliverNotification")
  assert.deepEqual(job.queueConsumers, [{
    capability: "queue.jobs.notifications",
    queue: "jobs"
  }])
})
