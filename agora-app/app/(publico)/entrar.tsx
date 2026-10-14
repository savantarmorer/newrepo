import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';
import { Botao } from '@/components/Botao';
import { CampoForm } from '@/components/Campo';
import { Card } from '@/components/Card';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { entrarComGoogle, entrarComLinkMagico, entrarComSenha } from '@/lib/auth';
import { env } from '@/lib/env';
import { textoDoErro } from '@/lib/erros';
import { toast } from '@/stores/toast';

const esquema = z.object({
  email: z.string().trim().email('Digite um e-mail válido'),
  senha: z.string().optional(),
});
type Form = z.infer<typeof esquema>;

export default function Entrar() {
  const [enviado, setEnviado] = useState<string | null>(null);
  const [usarSenha, setUsarSenha] = useState(false);
  const [carregando, setCarregando] = useState<'link' | 'google' | 'senha' | null>(null);
  const { control, handleSubmit } = useForm<Form>({ resolver: zodResolver(esquema), defaultValues: { email: '', senha: '' } });

  const enviar = handleSubmit(async ({ email, senha }) => {
    try {
      if (usarSenha) {
        setCarregando('senha');
        await entrarComSenha(email, senha ?? '');
      } else {
        setCarregando('link');
        await entrarComLinkMagico(email);
        setEnviado(email);
      }
    } catch (e) {
      toast.erro(textoDoErro(e));
    } finally {
      setCarregando(null);
    }
  });

  if (enviado) {
    return (
      <Tela>
        <Card destaque="secundaria">
          <Texto variante="subtitulo">Confira seu e-mail</Texto>
          <Texto cor="secundario" style={{ marginTop: 8 }}>
            Enviamos um link de acesso para {enviado}. Abra-o neste aparelho para entrar. O link vale por uma hora.
          </Texto>
        </Card>
        <Botao titulo="Usar outro e-mail" variante="fantasma" onPress={() => setEnviado(null)} />
      </Tela>
    );
  }

  return (
    <Tela teclado>
      <View style={{ gap: 6 }}>
        <Texto variante="titulo">Bem-vinda, bem-vindo</Texto>
        <Texto cor="secundario">Entre com seu e-mail — sem senha para decorar — ou com sua conta Google.</Texto>
      </View>
      <CampoForm control={control} nome="email" rotulo="E-mail" placeholder="voce@exemplo.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
      {usarSenha ? <CampoForm control={control} nome="senha" rotulo="Senha" secureTextEntry autoComplete="password" /> : null}
      <Botao titulo={usarSenha ? 'Entrar' : 'Receber link de acesso'} icone={usarSenha ? 'log-in' : 'mail'} largura="total" carregando={carregando === 'link' || carregando === 'senha'} onPress={enviar} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: '#0002' }} />
        <Texto variante="legenda" cor="sutil">ou</Texto>
        <View style={{ flex: 1, height: 1, backgroundColor: '#0002' }} />
      </View>
      <Botao
        titulo="Continuar com Google"
        icone="globe"
        variante="secundario"
        largura="total"
        carregando={carregando === 'google'}
        onPress={async () => {
          try {
            setCarregando('google');
            await entrarComGoogle();
          } catch (e) {
            toast.erro(textoDoErro(e));
          } finally {
            setCarregando(null);
          }
        }}
      />
      {env.loginPorSenha ? (
        <Botao titulo={usarSenha ? 'Prefiro o link por e-mail' : 'Entrar com senha (contas de teste)'} variante="fantasma" largura="total" onPress={() => setUsarSenha(!usarSenha)} />
      ) : null}
      <Texto variante="legenda" cor="sutil" centro>
        Ao entrar você concorda com o Código de Conduta e com a política de privacidade da Ágora. Não usamos rastreadores nem vendemos dados.
      </Texto>
    </Tela>
  );
}
