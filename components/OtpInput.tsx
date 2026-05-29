import React, { useRef } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { colors } from '@/constants/throttlist'

interface Props {
  value: string
  onChange: (v: string) => void
  autoFocus?: boolean
}

export default function OtpInput({ value, onChange, autoFocus }: Props) {
  const inputRef = useRef<TextInput>(null)

  function handlePress() {
    inputRef.current?.focus()
  }

  function handleChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 6)
    onChange(digits)
  }

  return (
    <Pressable style={styles.wrapper} onPress={handlePress}>
      {/* Hidden TextInput */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        caretHidden
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus={autoFocus}
        style={styles.hiddenInput}
        maxLength={6}
      />

      {/* 6 visible boxes */}
      <View style={styles.boxes}>
        {Array.from({ length: 6 }).map((_, i) => {
          const char = value[i] ?? ''
          const isActive = i === value.length && value.length < 6
          return (
            <View
              key={i}
              style={[
                styles.box,
                isActive && styles.boxActive,
              ]}
            >
              <Text style={styles.boxText}>{char}</Text>
            </View>
          )
        })}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  boxes: {
    flexDirection: 'row',
    gap: 10,
  },
  box: {
    width: 44,
    height: 52,
    borderRadius: 8,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  boxText: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
})
