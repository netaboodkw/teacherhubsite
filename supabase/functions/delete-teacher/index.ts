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
      console.log('No authorization header provided');
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
      console.log('Failed to get user:', userError);
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
      console.log('User is not admin:', user.id);
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

    console.log('Starting deletion for teacher:', teacherUserId);

    // Prevent deleting self
    if (teacherUserId === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete all related data in order (to respect foreign keys)
    // Using Promise.allSettled to continue even if some tables don't have data
    
    // 1. Delete student achievements (references students and classrooms)
    const { error: achievementsError } = await supabaseAdmin
      .from('student_achievements')
      .delete()
      .eq('user_id', teacherUserId);
    if (achievementsError) console.log('Error deleting student_achievements:', achievementsError.message);

    // 2. Delete daily classroom stats (references classrooms and students)
    const { error: statsError } = await supabaseAdmin
      .from('daily_classroom_stats')
      .delete()
      .eq('user_id', teacherUserId);
    if (statsError) console.log('Error deleting daily_classroom_stats:', statsError.message);

    // 3. Delete attendance records
    const { error: attendanceError } = await supabaseAdmin
      .from('attendance_records')
      .delete()
      .eq('user_id', teacherUserId);
    if (attendanceError) console.log('Error deleting attendance_records:', attendanceError.message);

    // 4. Delete grades
    const { error: gradesError } = await supabaseAdmin
      .from('grades')
      .delete()
      .eq('user_id', teacherUserId);
    if (gradesError) console.log('Error deleting grades:', gradesError.message);

    // 5. Delete behavior notes
    const { error: behaviorError } = await supabaseAdmin
      .from('behavior_notes')
      .delete()
      .eq('user_id', teacherUserId);
    if (behaviorError) console.log('Error deleting behavior_notes:', behaviorError.message);

    // 6. Delete student positions
    const { error: positionsError } = await supabaseAdmin
      .from('student_positions')
      .delete()
      .eq('user_id', teacherUserId);
    if (positionsError) console.log('Error deleting student_positions:', positionsError.message);

    // 7. Delete students
    const { error: studentsError } = await supabaseAdmin
      .from('students')
      .delete()
      .eq('user_id', teacherUserId);
    if (studentsError) console.log('Error deleting students:', studentsError.message);

    // 8. Delete shared templates (references teacher_grading_templates)
    const { error: sharedTemplatesError } = await supabaseAdmin
      .from('shared_templates')
      .delete()
      .eq('user_id', teacherUserId);
    if (sharedTemplatesError) console.log('Error deleting shared_templates:', sharedTemplatesError.message);

    // 9. Delete teacher grading templates
    const { error: templatesError } = await supabaseAdmin
      .from('teacher_grading_templates')
      .delete()
      .eq('user_id', teacherUserId);
    if (templatesError) console.log('Error deleting teacher_grading_templates:', templatesError.message);

    // 10. Delete teacher department head invitations (both as teacher and as department head)
    const { error: invitationsError1 } = await supabaseAdmin
      .from('teacher_department_head_invitations')
      .delete()
      .eq('teacher_id', teacherUserId);
    if (invitationsError1) console.log('Error deleting invitations by teacher_id:', invitationsError1.message);

    // 11. Delete classrooms
    const { error: classroomsError } = await supabaseAdmin
      .from('classrooms')
      .delete()
      .eq('user_id', teacherUserId);
    if (classroomsError) console.log('Error deleting classrooms:', classroomsError.message);

    // 12. Delete subscription payments
    const { error: paymentsError } = await supabaseAdmin
      .from('subscription_payments')
      .delete()
      .eq('user_id', teacherUserId);
    if (paymentsError) console.log('Error deleting subscription_payments:', paymentsError.message);

    // 13. Delete teacher subscriptions
    const { error: subscriptionsError } = await supabaseAdmin
      .from('teacher_subscriptions')
      .delete()
      .eq('user_id', teacherUserId);
    if (subscriptionsError) console.log('Error deleting teacher_subscriptions:', subscriptionsError.message);

    // 14. Delete subscription notifications
    const { error: subNotifError } = await supabaseAdmin
      .from('subscription_notifications')
      .delete()
      .eq('user_id', teacherUserId);
    if (subNotifError) console.log('Error deleting subscription_notifications:', subNotifError.message);

    // 15. Delete supervision notifications (both as sender and recipient)
    const { error: supervisionNotif1 } = await supabaseAdmin
      .from('supervision_notifications')
      .delete()
      .eq('sender_id', teacherUserId);
    if (supervisionNotif1) console.log('Error deleting supervision_notifications by sender:', supervisionNotif1.message);

    const { error: supervisionNotif2 } = await supabaseAdmin
      .from('supervision_notifications')
      .delete()
      .eq('recipient_id', teacherUserId);
    if (supervisionNotif2) console.log('Error deleting supervision_notifications by recipient:', supervisionNotif2.message);

    // 16. Delete notification preferences
    const { error: notifPrefError } = await supabaseAdmin
      .from('notification_preferences')
      .delete()
      .eq('user_id', teacherUserId);
    if (notifPrefError) console.log('Error deleting notification_preferences:', notifPrefError.message);

    // 17. Delete push notification tokens
    const { error: pushTokensError } = await supabaseAdmin
      .from('push_notification_tokens')
      .delete()
      .eq('user_id', teacherUserId);
    if (pushTokensError) console.log('Error deleting push_notification_tokens:', pushTokensError.message);

    // 18. Delete AI generated content
    const { error: aiContentError } = await supabaseAdmin
      .from('ai_generated_content')
      .delete()
      .eq('user_id', teacherUserId);
    if (aiContentError) console.log('Error deleting ai_generated_content:', aiContentError.message);

    // 19. Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', teacherUserId);
    if (profileError) console.log('Error deleting profiles:', profileError.message);

    // 20. Delete user roles
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', teacherUserId);
    if (rolesError) console.log('Error deleting user_roles:', rolesError.message);

    // 21. Invalidate ALL user sessions immediately
    console.log('Invalidating all sessions for user:', teacherUserId);
    try {
      // Sign out user from all sessions globally
      const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(teacherUserId, 'global');
      if (signOutError) {
        console.log('Error signing out user (continuing with deletion):', signOutError.message);
      } else {
        console.log('Successfully invalidated all sessions for user:', teacherUserId);
      }
    } catch (signOutErr) {
      console.log('SignOut error (continuing with deletion):', signOutErr);
    }

    // 22. Finally, delete the auth user
    console.log('Deleting auth user:', teacherUserId);
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(teacherUserId);
    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError.message);
      // This is critical - if auth user deletion fails, we should report it
      return new Response(JSON.stringify({ 
        error: 'Failed to delete auth user: ' + deleteUserError.message,
        partialSuccess: true 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully deleted teacher and all related data:', teacherUserId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in delete-teacher:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
