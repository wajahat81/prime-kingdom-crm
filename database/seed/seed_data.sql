-- Create initial Super Admin and Employee accounts
-- Note: Passwords must be hashed via the backend or Supabase Auth. 
-- For this seed script, we will insert raw profiles assuming the auth.users records already exist, 
-- or you can register these via the User Management UI.

-- Insert into Profiles (Assuming you have UUIDs from auth.users)
-- Replace the UUIDs with the actual ones generated when you sign up via the UI.

INSERT INTO profiles (id, full_name, role) VALUES 
('your-auth-uuid-1', 'Muhammad Wajahat Haider', 'super_admin'),
('your-auth-uuid-2', 'Jane Manager', 'admin'),
('your-auth-uuid-3', 'John Agent', 'employee');


-- Seed Initial Announcement
INSERT INTO announcements (message, is_active) VALUES
('Welcome to the Prime Kingdom CRM platform! Have a great shift.', true);

-- Seed Dummy Call Data for testing the UI

INSERT INTO calls (employee_id, client_name, status) VALUES
('your-auth-uuid-3', 'Acme Corp', 'retained'),
('your-auth-uuid-3', 'Global Tech', 'pending'),
('your-auth-uuid-3', 'Stark Industries', 'not_retained');
