import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vfvyjbuqawggdwovjveb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmdnlqYnVxYXdnZ2R3b3ZqdmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMzA5OTMsImV4cCI6MjA3MzgwNjk5M30.SFT8Oy1GRfDlkSsKMyCASVo5Bnd3wyCgQVYvk4tyD9k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);