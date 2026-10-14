import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { registrarCarteira } from './services';
import { assinarMensagem, carteiraDisponivel, conectarCarteiraEmbutida } from './wallet';

/**
 * Conecta a carteira embutida usando o JWT da sessão (sem frase-semente) e, na primeira
 * vez, vincula o endereço à conta com uma assinatura — o backend então emite o SBT.
 */
export function useCarteiraConectada() {
  const qc = useQueryClient();
  const [endereco, setEndereco] = useState<string | null>(null);
  const conectar = useMutation({
    mutationFn: async (opts?: { vincular?: boolean }) => {
      const { data } = await supabase.auth.getSession();
      const jwt = data.session?.access_token;
      if (!jwt) throw new Error('Sessão expirada.');
      const { endereco: end, dona } = await conectarCarteiraEmbutida(jwt);
      setEndereco(end);
      if (opts?.vincular) {
        const mensagem = `Ágora: vincular a carteira ${end} à minha conta ${data.session!.user.id} em ${new Date().toISOString()}`;
        const assinatura = await assinarMensagem(mensagem);
        await registrarCarteira({ endereco: end, mensagem, assinatura, tipo: 'embutida', conta_dona: dona });
        qc.invalidateQueries({ queryKey: ['carteira'] });
      }
      return end;
    },
  });
  return { disponivel: carteiraDisponivel(), endereco, conectar };
}
