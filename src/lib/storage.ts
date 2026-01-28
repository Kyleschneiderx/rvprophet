import { supabase } from './supabase';

const BUCKET_NAME = 'work-order-photos';

export async function uploadWorkOrderPhoto(
  dealershipId: string,
  workOrderId: string,
  file: File
): Promise<{ path: string; error: Error | null }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${dealershipId}/${workOrderId}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return { path: '', error: new Error(error.message) };
  }

  return { path: filePath, error: null };
}

export async function getPhotoUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, 3600); // 1 hour expiry

  return data?.signedUrl ?? null;
}

export async function getPhotoUrls(paths: string[]): Promise<(string | null)[]> {
  return Promise.all(paths.map(getPhotoUrl));
}

export async function deleteWorkOrderPhoto(path: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

export async function deleteWorkOrderPhotos(
  dealershipId: string,
  workOrderId: string
): Promise<{ error: Error | null }> {
  const folderPath = `${dealershipId}/${workOrderId}`;

  // List all files in the work order folder
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderPath);

  if (listError) {
    return { error: new Error(listError.message) };
  }

  if (!files || files.length === 0) {
    return { error: null };
  }

  // Delete all files
  const filePaths = files.map(file => `${folderPath}/${file.name}`);
  const { error: deleteError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(filePaths);

  if (deleteError) {
    return { error: new Error(deleteError.message) };
  }

  return { error: null };
}
