-- Enable realtime for teacher_subscriptions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_subscriptions;

-- Enable realtime for subscription_payments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_payments;