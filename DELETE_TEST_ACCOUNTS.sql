-- UPDATED: Simple SQL commands to delete test user accounts
-- CASCADE DELETE is now enabled - deleting a user automatically removes all related data!

-- Current test accounts in database:
-- ID 1:  Founder1 (waddleinnovations@outlook.com)
-- ID 2:  demo (demo@example.com) 
-- ID 3:  Rodrick (waddleinnovations@gmail.com)
-- ID 4:  Rodrickl1 (rodrickwaddle@gmail.com)
-- ID 5:  Rodrickl2 (waddleonnovations@outlook.com)
-- ID 7:  Felix1 (rlloydinv@gmail.com)
-- ID 8:  ben.silbert@array.com (ben.silbert@array.com)
-- ID 10: Red2 (redfox@gmail.com)
-- ID 11: testuser123 (test@example.com)
-- ID 17: Mr.Waddle (thewaddles622@gmail.com) - MAIN ACCOUNT - DO NOT DELETE
-- ID 18: TLW2026 (ladell.wilson.lw@gmail.com)
-- ID 22: wilsonj23 (juliusmwilson@gmail.com)
-- ID 23: Chanelwaddle (chanel.waddle@gmail.com)

-- SIMPLE COMMANDS - CASCADE DELETE AUTOMATICALLY REMOVES ALL RELATED DATA:

-- Delete test account ID 11 (testuser123)
DELETE FROM users WHERE id = 11;

-- Delete test account ID 10 (Red2)
DELETE FROM users WHERE id = 10;

-- Delete test account ID 22 (wilsonj23)
DELETE FROM users WHERE id = 22;

-- Delete test account ID 23 (Chanelwaddle) 
DELETE FROM users WHERE id = 23;

-- Delete test account ID 18 (TLW2026)
DELETE FROM users WHERE id = 18;

-- Verify remaining users
SELECT id, username, first_name, last_name, email FROM users ORDER BY created_at;