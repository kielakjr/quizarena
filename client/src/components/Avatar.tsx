import { getInitials, getAvatarColor } from '../utils/avatar';

interface AvatarProps {
  nickname: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

const Avatar = ({ nickname, size = 'md' }: AvatarProps) => {
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none`}
      style={{ backgroundColor: getAvatarColor(nickname) }}
    >
      {getInitials(nickname)}
    </div>
  );
};

export default Avatar;
