-- Open every active writing prompt. Unit progression (finish unit N to
-- unlock unit N+1) is enforced in the app, not by this flag.
UPDATE prompts
SET is_locked = FALSE
WHERE is_active = TRUE;
