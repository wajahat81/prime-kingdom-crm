-- Enums for Strict Input Validation at DB level
CREATE TYPE user_role AS ENUM ('employee', 'admin', 'super_admin');
CREATE TYPE call_status AS ENUM ('pending', 'retained', 'not_retained');

-- Tables
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'employee' NOT NULL
);

CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES profiles(id) NOT NULL,
    client_name TEXT NOT NULL,
    status call_status DEFAULT 'pending',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES profiles(id) NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_out TIMESTAMP WITH TIME ZONE,
    date DATE DEFAULT CURRENT_DATE
);

-- Force Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Security Policies (Locking Record Access)
-- Employees only see their own calls
CREATE POLICY "Employee view own calls" ON calls 
FOR SELECT USING (auth.uid() = employee_id);

-- Employees can insert their own check-in but cannot update past check-ins
CREATE POLICY "Employee self check-in" ON attendance 
FOR INSERT WITH CHECK (auth.uid() = employee_id);

-- Admins and Super Admins have full access to calls
CREATE POLICY "Admin global call access" ON calls 
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);