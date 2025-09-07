-- Phase 1: Fix Critical RLS Vulnerability - Drop existing policies first

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own requests" ON public.renovation_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON public.renovation_requests;
DROP POLICY IF EXISTS "Users can create requests" ON public.renovation_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.renovation_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON public.renovation_requests;

-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for proper role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;