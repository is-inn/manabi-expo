import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'

/** 写真アイコンは data URI の文字列で持つ（絵文字と同じ User.avatar に入る） */
export const isPhotoAvatar = (avatar: string): boolean => avatar.startsWith('data:image/')

/** 文章の中に混ぜて表示するときの代わりの絵文字（写真は文字にできない） */
export const avatarAsText = (avatar: string): string => (isPhotoAvatar(avatar) ? '👤' : avatar)

const PHOTO_SIZE = 256

/** 自分の写真から選んで、正方形に切り抜き・縮小した data URI を返す。やめたら null */
export async function pickPhotoAvatar(): Promise<string | null> {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  })
  if (picked.canceled || !picked.assets[0]) return null
  const out = await ImageManipulator.manipulateAsync(
    picked.assets[0].uri,
    [{ resize: { width: PHOTO_SIZE, height: PHOTO_SIZE } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  )
  return out.base64 ? `data:image/jpeg;base64,${out.base64}` : null
}
