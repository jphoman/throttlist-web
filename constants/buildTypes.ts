export const BUILD_CATEGORIES = [
  { id: 'motorcycles',  label: 'Motorcycles',   icon: '🏍️' },
  { id: 'cars',         label: 'Cars',           icon: '🚗' },
  { id: 'bicycles',     label: 'Bicycles',       icon: '🚲' },
  { id: 'drones',       label: 'Drones',         icon: '🚁' },
  { id: 'pc_gaming',    label: 'PC / Gaming',    icon: '🖥️' },
  { id: 'audio_hifi',   label: 'Audio / Hi-Fi',  icon: '🎵' },
  { id: 'keyboards',    label: 'Keyboards',      icon: '⌨️' },
  { id: 'guitars',      label: 'Guitars',        icon: '🎸' },
  { id: '3d_printing',  label: '3D Printing',    icon: '🖨️' },
  { id: 'camping',      label: 'Camping / Outdoor', icon: '⛺' },
]

export type BuildCategory = typeof BUILD_CATEGORIES[number]['id']
