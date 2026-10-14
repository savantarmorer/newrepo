import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export type Bucket = 'avatares' | 'capas' | 'comprovantes';

export async function escolherImagem(opcoes?: { quadrada?: boolean; camera?: boolean }) {
  const permissao = opcoes?.camera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissao.granted) throw new Error('Precisamos da sua permissão para acessar as fotos.');
  const config: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: true,
    aspect: opcoes?.quadrada ? [1, 1] : [16, 9],
  };
  const r = opcoes?.camera ? await ImagePicker.launchCameraAsync(config) : await ImagePicker.launchImageLibraryAsync(config);
  if (r.canceled || !r.assets[0]) return null;
  return r.assets[0];
}

/**
 * Envia um arquivo local para o Storage. `pasta` deve ser o uid (avatares/capas)
 * ou o id do projeto (comprovantes) — as políticas do bucket conferem isso.
 */
export async function enviarArquivo(bucket: Bucket, pasta: string, uri: string, tipo = 'image/jpeg'): Promise<string> {
  const resposta = await fetch(uri);
  const conteudo = await resposta.arrayBuffer();
  const extensao = tipo === 'application/pdf' ? 'pdf' : tipo.split('/')[1] ?? 'jpg';
  const caminho = `${pasta}/${Crypto.randomUUID()}.${extensao}`;
  const { error } = await supabase.storage.from(bucket).upload(caminho, conteudo, { contentType: tipo, upsert: false });
  if (error) throw new Error(`Falha no envio: ${error.message}`);
  if (bucket === 'comprovantes') return caminho; // bucket privado: guardamos o caminho
  return supabase.storage.from(bucket).getPublicUrl(caminho).data.publicUrl;
}

/** URL assinada (temporária) para ver um comprovante no bucket privado */
export async function urlAssinada(caminho: string, segundos = 300): Promise<string> {
  const { data, error } = await supabase.storage.from('comprovantes').createSignedUrl(caminho, segundos);
  if (error || !data) throw new Error('Não foi possível abrir o comprovante.');
  return data.signedUrl;
}
