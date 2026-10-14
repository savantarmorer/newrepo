/**
 * Versão web (navegador): a carteira embutida da Ágora é exclusiva do app móvel.
 * Mantém a mesma API de wallet.ts para que as telas funcionem em modo leitura.
 */
const indisponivel = () => Promise.reject(new Error('A carteira embutida está disponível apenas no app para Android e iOS.'));

export const carteiraDisponivel = () => false;
export const conectarCarteiraEmbutida = (_jwt: string): Promise<{ endereco: string; dona: string }> => indisponivel();
export const conectarCarteiraExterna = (): Promise<{ endereco: string }> => indisponivel();
export const assinarMensagem = (_m: string): Promise<string> => indisponivel();
export const lerSaldo = (_t: string, _e: string): Promise<bigint> => indisponivel();
export const lerVotos = (_t: string, _e: string): Promise<bigint> => indisponivel();
export const lerPoderDeVoto = (_g: string, _e: string, _b: bigint): Promise<bigint> => indisponivel();
export const resgatar = (_d: string, _ep: number, _c: string, _v: string, _p: string[]): Promise<string> => indisponivel();
export const delegar = (_t: string, _p: string): Promise<string> => indisponivel();
export const transferir = (_t: string, _p: string, _v: bigint): Promise<string> => indisponivel();
export const votarOnchain = (_g: string, _id: string, _s: 0 | 1 | 2, _m: string): Promise<string> => indisponivel();
export const proporOnchain = (_g: string, _a: string[], _v: bigint[], _d: string[], _desc: string): Promise<string> => indisponivel();
export const codificarLiberacaoFundo = (_f: string, _t: string, _d: string, _v: bigint, _r: string): Promise<string> => indisponivel();
export function desconectar() {}
