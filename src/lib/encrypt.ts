/**
 * encrypt.ts — Criptografia simétrica AES-256-GCM para tokens sensíveis.
 *
 * Usado para armazenar com segurança no banco de dados (Prisma/Supabase):
 *   - Tokens de API de terceiros (Lens.org, SerpApi, etc.)
 *   - Credenciais de integrações OAuth por usuário
 *
 * Variável de ambiente obrigatória:
 *   ENCRYPTION_KEY — string hexadecimal de 64 caracteres (= 32 bytes).
 *
 * Gerar uma chave válida:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Formato do texto cifrado: "<IV_hex>:<AuthTag_hex>:<Ciphertext_hex>"
 * Separator é ":" — nenhum desses campos contém ":" pois todos estão em hex.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;        // 96 bits — recomendado para GCM
const AUTH_TAG_LENGTH = 16;  // 128 bits — padrão do Node.js
const SEPARATOR = ':';

// ── Valida e carrega a chave uma única vez ─────────────────────
function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;

  if (!raw) {
    throw new Error(
      '[encrypt] ENCRYPTION_KEY não definida. ' +
        'Adicione uma string hex de 64 caracteres (32 bytes) ao .env.',
    );
  }

  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error(
      '[encrypt] ENCRYPTION_KEY inválida. ' +
        'Deve ser uma string hexadecimal de exatamente 64 caracteres (32 bytes). ' +
        'Gere com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }

  return Buffer.from(raw, 'hex');
}

/**
 * Criptografa um texto usando AES-256-GCM.
 *
 * @param text  Texto puro a ser criptografado.
 * @returns     String no formato `<IV>:<AuthTag>:<Ciphertext>` (tudo em hex).
 * @throws      Se `ENCRYPTION_KEY` não estiver configurada ou for inválida.
 */
export function encrypt(text: string): string {
  const key = getKey();
  const iv  = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(SEPARATOR);
}

/**
 * Decriptografa um texto cifrado com `encrypt()`.
 *
 * @param encrypted  String no formato `<IV>:<AuthTag>:<Ciphertext>` (hex).
 * @returns          Texto original decriptografado (UTF-8).
 * @throws           Se o formato for inválido, a chave incorreta, ou os dados
 *                   forem corrompidos (falha de autenticação GCM).
 */
export function decrypt(encrypted: string): string {
  const key  = getKey();
  const parts = encrypted.split(SEPARATOR);

  if (parts.length !== 3) {
    throw new Error(
      '[encrypt] Formato de texto cifrado inválido. ' +
        'Esperado: "<IV>:<AuthTag>:<Ciphertext>" (hex separado por ":")',
    );
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;

  let iv: Buffer, authTag: Buffer, ciphertext: Buffer;

  try {
    iv         = Buffer.from(ivHex,         'hex');
    authTag    = Buffer.from(authTagHex,    'hex');
    ciphertext = Buffer.from(ciphertextHex, 'hex');
  } catch {
    throw new Error('[encrypt] Falha ao decodificar os componentes hex do texto cifrado.');
  }

  if (iv.length !== IV_LENGTH) {
    throw new Error(`[encrypt] IV inválido: esperado ${IV_LENGTH} bytes, recebido ${iv.length}.`);
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(
      `[encrypt] AuthTag inválido: esperado ${AUTH_TAG_LENGTH} bytes, recebido ${authTag.length}.`,
    );
  }

  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch {
    throw new Error(
      '[encrypt] Falha na autenticação GCM. ' +
        'O texto cifrado pode estar corrompido ou ter sido criado com uma chave diferente.',
    );
  }
}
