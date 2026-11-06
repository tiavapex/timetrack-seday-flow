# Architecture rules
- Keep driver trip-based PPO separate from score-based PPO and legacy operational evaluations so each program retains its own records and calculation rules.
- Save PPC through the area-authorized atomic RPC; keep shared administrative responsibility in separate per-area keys so one area cannot erase another's decision.
- Preserve legacy PPC point totals until that area's indicator assessment is submitted; derive updated totals from its structured indicators rather than editable totals.
- Store driver PPO at employee/date/shift granularity with a unique key so weighing compliance excludes only the corresponding shift and duplicate shifts cannot double payment.
- Resolve per-user module overrides through protected permission storage with matching client and server defaults; module grants never confer administrator roles.
- Keep employee directory separate from account management; route guards and restrictive module policies enforce the same access decision.
- Enforce approval transitions server-side and route approved vacancies to RH and approved non-vacancy requests to DP.
- Define AuthContext in a separate non-component module so provider and hook share one context identity across hot-reloaded component generations.
