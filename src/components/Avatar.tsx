import { Image, Text, View } from 'react-native'
import { isPhotoAvatar } from '../utils/avatar'

/** 絵文字アイコン、または写真アイコン（data URI）を表示する */
export default function Avatar({ avatar, size }: { avatar: string; size: number }) {
  if (isPhotoAvatar(avatar)) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
        <Image source={{ uri: avatar }} style={{ width: size, height: size }} />
      </View>
    )
  }
  return <Text style={{ fontSize: size * 0.8 }}>{avatar}</Text>
}
