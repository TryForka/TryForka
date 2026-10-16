import { AppError, serve, serviceClient } from '../_shared/http.ts';

// Deletes the signed-in user. Every user table references auth.users with
// ON DELETE CASCADE, so removing the auth user removes their rows too; their avatar
// files are removed first because storage objects don't cascade.

serve(async (body, req) => {
  if (body.confirm !== 'DELETE') throw new AppError('Confirm to delete your account.', 400);
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const admin = serviceClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new AppError('Sign in again to continue.', 401);
  const userId = data.user.id;

  const { data: files } = await admin.storage.from('avatars').list(userId);
  if (files?.length) await admin.storage.from('avatars').remove(files.map(f => `${userId}/${f.name}`));

  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) {
    console.error('[delete-account] failed:', delErr);
    throw new AppError("Couldn't delete your account. Try again.", 500);
  }
  console.log('[delete-account] deleted', userId);
  return { deleted: true };
});
