# Project objectives and implementation instructions

Read `Agentic.md` for the subagent roster and delegation rules, and `Mem.md` for collective chronological memory. Keep role definitions in `Agentic.md` and record meaningful handoffs and outcomes in `Mem.md` using its update protocol.

Build a human-centered operational tool for Hack to the Future that demonstrates technical quality to Cat Digital judges and measurable business value to strategy judges.

## Product behavior

- Target field technicians and operations managers who need to identify equipment issues and act quickly.
- Present equipment health, telemetry, alerts, and outstanding work in a clear dashboard.
- Translate complex data into plain-language issues, urgency, and recommended next steps.
- Support a complete workflow: review an alert, inspect equipment details, create or assign a work order, and track resolution.
- Use clear navigation, readable labels, responsive layouts, and minimal steps for common tasks so non-technical users can adopt the product easily.
- Show operational value through response time, downtime, and completed work. Label estimated savings and explain their assumptions; do not present simulated results as measured ROI.

## Backend requirements

- Flesh out the backend sufficiently to support the entire demonstrated workflow reliably.
- Implement persistent database storage, validated API endpoints, equipment and telemetry records, alerts, work orders, and useful error handling.
- Connect frontend actions to real API operations and persist changes; reflect saved updates in the interface.
- Use meaningful integration tests to verify database persistence and the alert-to-work-order workflow.
- Clearly identify simulated telemetry and seeded demonstration data.

## Frontend and presentation priority

- After establishing the backend capabilities needed for the demo, prioritize frontend usability, visual quality, and successful project display.
- Give the dashboard and core workflow the most polish so judges immediately understand the problem, recommended action, and resulting value.
- Include loading, empty, error, and success states. Make failures understandable and recoverable.
- Keep the interface friction-free and avoid exposing implementation details that do not help users make decisions.
- Prepare realistic seed data and a reliable live demonstration from an equipment alert to a resolved work order, with visible operational impact.

## Business strategy and scope

- Identify the target customer and buyer, the workflow being improved, and how the product lowers costs, speeds up work, or unlocks useful intelligence.
- Explain how the MVP could scale across equipment fleets and integrate with enterprise systems. Distinguish implemented functionality from future plans.
- Favor a complete, convincing demonstration over unrelated features. Allocate remaining effort to frontend polish and a clear business pitch.
- Keep the existing ordered starter tasks in `TASKS.md` as the initial foundation; these objectives guide subsequent product development and do not imply that the full workflow is already implemented.
