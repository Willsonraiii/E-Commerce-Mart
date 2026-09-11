const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const Icon = ({ path, size = 20, className, children, viewBox = '0 0 24 24', ...rest }) => (
  <svg width={size} height={size} viewBox={viewBox} className={className} aria-hidden="true" {...base} {...rest}>
    {path ? <path d={path} /> : children}
  </svg>
)

export const SearchIcon = (p) => (
  <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></Icon>
)
export const BagIcon = (p) => (
  <Icon {...p}><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9.5 8V6.5a2.5 2.5 0 0 1 5 0V8" /></Icon>
)
export const UserIcon = (p) => (
  <Icon {...p}><circle cx="12" cy="8.5" r="3.6" /><path d="M4.8 20c1-3.7 3.8-5.5 7.2-5.5s6.2 1.8 7.2 5.5" /></Icon>
)
export const HeartIcon = ({ filled, ...p }) => (
  <Icon {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20s-7.2-4.4-7.2-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.2 2.6C19.2 15.6 12 20 12 20Z" />
  </Icon>
)
export const MenuIcon = (p) => (
  <Icon {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>
)
export const CloseIcon = (p) => (
  <Icon {...p}><path d="m6 6 12 12M18 6 6 18" /></Icon>
)
export const PlusIcon = (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
export const MinusIcon = (p) => <Icon {...p}><path d="M5 12h14" /></Icon>
export const ArrowRight = (p) => (
  <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
)
export const ArrowLeft = (p) => (
  <Icon {...p}><path d="M19 12H5M11 18l-6-6 6-6" /></Icon>
)
export const CheckIcon = (p) => <Icon {...p}><path d="m5 13 4.2 4.2L19 7.5" /></Icon>
export const StarIcon = ({ filled, ...p }) => (
  <Icon {...p} fill={filled ? 'currentColor' : 'none'} strokeWidth={1.4}>
    <path d="m12 3.6 2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.9l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85L12 3.6Z" />
  </Icon>
)
export const TruckIcon = (p) => (
  <Icon {...p}>
    <path d="M2.5 7.5h11v9h-11z" /><path d="M13.5 11h4l3 3v2.5h-7z" />
    <circle cx="6.5" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" />
  </Icon>
)
export const LeafIcon = (p) => (
  <Icon {...p}>
    <path d="M20 4C10 4 4 8.5 4 15.5A4.5 4.5 0 0 0 8.5 20C15.5 20 20 14 20 4Z" />
    <path d="M4.8 19.2 13 11" />
  </Icon>
)
export const ShieldIcon = (p) => (
  <Icon {...p}><path d="M12 3.5 19 6v6c0 4.2-2.9 7.4-7 8.5-4.1-1.1-7-4.3-7-8.5V6l7-2.5Z" /><path d="m9 12 2.2 2.2L15.5 10" /></Icon>
)
export const ClockIcon = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 1.8" /></Icon>
)
export const PinIcon = (p) => (
  <Icon {...p}><path d="M12 21s6.5-5.4 6.5-10a6.5 6.5 0 1 0-13 0C5.5 15.6 12 21 12 21Z" /><circle cx="12" cy="11" r="2.4" /></Icon>
)
export const PhoneIcon = (p) => (
  <Icon {...p}><path d="M6 3.5h3l1.5 4-2 1.4a11.5 11.5 0 0 0 5.6 5.6l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 5.7 2 2 0 0 1 6 3.5Z" /></Icon>
)
export const MailIcon = (p) => (
  <Icon {...p}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="m3.8 7 8.2 6 8.2-6" /></Icon>
)
export const FilterIcon = (p) => (
  <Icon {...p}><path d="M4 6h16M7 12h10M10 18h4" /></Icon>
)
export const GridIcon = (p) => (
  <Icon {...p}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
  </Icon>
)
export const BoxIcon = (p) => (
  <Icon {...p}><path d="m12 3 8 4.2v9.6L12 21l-8-4.2V7.2L12 3Z" /><path d="m4 7.2 8 4.3 8-4.3M12 21v-9.5" /></Icon>
)
export const ChartIcon = (p) => (
  <Icon {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Icon>
)
export const UsersIcon = (p) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.8-3.2 3-4.8 5.5-4.8s4.7 1.6 5.5 4.8" />
    <path d="M16 5.4a3.2 3.2 0 0 1 0 5.2M17.5 14.6c2 .6 3.3 2.1 3.9 4.4" />
  </Icon>
)
export const TagIcon = (p) => (
  <Icon {...p}><path d="M11 3.5H20.5V13L11.8 21.7a1.6 1.6 0 0 1-2.3 0L2.8 15a1.6 1.6 0 0 1 0-2.3L11 3.5Z" /><circle cx="16.2" cy="7.8" r="1.4" /></Icon>
)
export const SettingsIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5 16.8 7.2M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" />
  </Icon>
)
export const LogoutIcon = (p) => (
  <Icon {...p}><path d="M14.5 7.5V5.2a1.7 1.7 0 0 0-1.7-1.7H5.7A1.7 1.7 0 0 0 4 5.2v13.6a1.7 1.7 0 0 0 1.7 1.7h7.1a1.7 1.7 0 0 0 1.7-1.7v-2.3" /><path d="M9.5 12h11M17 8.5l3.5 3.5L17 15.5" /></Icon>
)
export const SparkIcon = (p) => (
  <Icon {...p}><path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z" /></Icon>
)
export const EyeIcon = (p) => (
  <Icon {...p}><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></Icon>
)
export const CubeIcon = (p) => (
  <Icon {...p}><path d="m12 2.8 8.4 4.5v9.4L12 21.2l-8.4-4.5V7.3L12 2.8Z" /><path d="m3.6 7.3 8.4 4.6 8.4-4.6M12 21.2v-9.3" /></Icon>
)
export const TrashIcon = (p) => (
  <Icon {...p}><path d="M4.5 6.5h15M9 6.5V4.8h6v1.7M6.5 6.5 7.4 20h9.2l.9-13.5M10.2 10v6.3M13.8 10v6.3" /></Icon>
)
export const EditIcon = (p) => (
  <Icon {...p}><path d="M4 20h4l10-10-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></Icon>
)
export const UploadIcon = (p) => (
  <Icon {...p}><path d="M12 16V4.5M8 8l4-4 4 4" /><path d="M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15" /></Icon>
)
