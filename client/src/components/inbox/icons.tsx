import {
  Archive,
  ArrowLeft,
  Check,
  ChevronDown,
  Mail,
  Moon,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

type IconProps = { size?: number; className?: string };

function wrap(Icon: typeof Archive) {
  return function Wrapped({ size = 16, className }: IconProps) {
    return <Icon size={size} className={className} aria-hidden="true" />;
  };
}

export const ArchiveIcon = wrap(Archive);
export const BackIcon = wrap(ArrowLeft);
export const CheckIcon = wrap(Check);
export const ClearIcon = wrap(X);
export const MailIcon = wrap(Mail);
export const MoonIcon = wrap(Moon);
export const SearchIcon = wrap(Search);
export const TrashIcon = wrap(Trash2);
export const FilterIcon = wrap(SlidersHorizontal);
export const ChevronDownIcon = wrap(ChevronDown);