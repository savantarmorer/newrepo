import { forwardRef } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { useTema } from '@/theme/ThemeProvider';
import { ALVO_TOQUE } from '@/theme/tokens';
import { Texto } from './Texto';

export interface CampoProps extends TextInputProps {
  rotulo: string;
  erro?: string;
  ajuda?: string;
  contador?: number;
}

export const Campo = forwardRef<TextInput, CampoProps>(function Campo({ rotulo, erro, ajuda, contador, multiline, style, value, ...props }, ref) {
  const { c, raio, espaco, familias } = useTema();
  return (
    <View style={{ gap: 6 }}>
      <Texto variante="rotulo" cor="secundario" nativeID={`rotulo-${rotulo}`}>{rotulo}</Texto>
      <TextInput
        ref={ref}
        accessibilityLabel={rotulo}
        accessibilityHint={ajuda}
        placeholderTextColor={c.textoSutil}
        multiline={multiline}
        value={value}
        maxFontSizeMultiplier={1.6}
        style={[
          {
            minHeight: multiline ? 120 : ALVO_TOQUE + 4,
            borderWidth: 1,
            borderColor: erro ? c.perigo : c.bordaForte,
            borderRadius: raio.md,
            backgroundColor: c.superficieElevada,
            color: c.texto,
            paddingHorizontal: espaco.md,
            paddingVertical: multiline ? espaco.md : espaco.sm,
            fontFamily: familias.ui,
            fontSize: 16,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          style,
        ]}
        {...props}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        {erro ? (
          <Texto variante="legenda" cor="perigo" accessibilityLiveRegion="polite" style={{ flex: 1 }}>{erro}</Texto>
        ) : ajuda ? (
          <Texto variante="legenda" cor="sutil" style={{ flex: 1 }}>{ajuda}</Texto>
        ) : <View style={{ flex: 1 }} />}
        {contador !== undefined ? (
          <Texto variante="legenda" cor={(value?.length ?? 0) < contador ? 'sutil' : 'sucesso'}>
            {value?.length ?? 0}/{contador}
          </Texto>
        ) : null}
      </View>
    </View>
  );
});

/** Campo ligado ao React Hook Form */
export function CampoForm<T extends FieldValues>({
  control, nome, ...props
}: Omit<CampoProps, 'value' | 'onChangeText'> & { control: Control<T>; nome: Path<T> }) {
  return (
    <Controller
      control={control}
      name={nome}
      render={({ field, fieldState }) => (
        <Campo
          {...props}
          value={field.value === undefined || field.value === null ? '' : String(field.value)}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          erro={fieldState.error?.message}
        />
      )}
    />
  );
}
