import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the authorization header to verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with user's token to verify admin status
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the requesting user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the teacher's user_id to delete
    const { teacherUserId } = await req.json();
    if (!teacherUserId) {
      return new Response(JSON.stringify({ error: 'Teacher user ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent deleting self
    if (teacherUserId === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete all related data in order (to respect foreign keys)
    // 1. Delete attendance records
    await supabaseAdmin
      .from('attendance_records')
      .delete()
      .eq('user_id', teacherUserId);

    // 2. Delete grades
    await supabaseAdmin
      .from('grades')
      .delete()
      .eq('user_id', teacherUserId);

    // 3. Delete behavior notes
    await supabaseAdmin
      .from('behavior_notes')
      .delete()
      .eq('user_id', teacherUserId);

    // 4. Delete student positions
    await supabaseAdmin
      .from('student_positions')
      .delete()
      .eq('user_id', teacherUserId);

    // 5. Delete students
    await supabaseAdmin
      .from('students')
      .delete()
      .eq('user_id', teacherUserId);

    // 6. Delete teacher grading templates
    await supabaseAdmin
      .from('teacher_grading_templates')
      .delete()
      .eq('user_id', teacherUserId);

    // 7. Delete classrooms
    await supabaseAdmin
      .from('classrooms')
      .delete()
      .eq('user_id', teacherUserId);

    // 8. Delete profile
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', teacherUserId);

    // 9. Delete user roles
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', teacherUserId);

    // 10. Delete the auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(teacherUserId);
    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      // Continue anyway as all data is deleted
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
