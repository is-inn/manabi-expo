import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'

/** 記録に付ける写真：長い辺をこの大きさにそろえて小さくする（端末の保存・家族への共有が重くならないように） */
const MAX_SIDE = 480

export type PhotoSource = 'camera' | 'library'

/** 写真をとる／えらぶ。長い辺 480px・JPEG に縮めた data URI を返す。やめた・許可されなかったときは null */
export async function pickStudyPhoto(source: PhotoSource): Promise<string | null> {
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: false, quality: 1 }
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) return null
  }
  const picked = source === 'camera'
    ? await ImagePicker.launchCameraAsync(opts)
    : await ImagePicker.launchImageLibraryAsync(opts)
  if (picked.canceled || !picked.assets[0]) return null
  const a = picked.assets[0]
  const resize = a.width >= a.height ? { width: Math.min(a.width, MAX_SIDE) } : { height: Math.min(a.height, MAX_SIDE) }
  const out = await ImageManipulator.manipulateAsync(
    a.uri,
    [{ resize }],
    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  )
  return out.base64 ? `data:image/jpeg;base64,${out.base64}` : null
}
