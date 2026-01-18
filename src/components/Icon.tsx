import Logo from "../assets/Logo";

const icons = {
  logo: Logo,
};

type IconName = keyof typeof icons;

interface IconProps {
  name: IconName;
  className?: string;
  onClick?: () => void;
}

const Icon: React.FC<IconProps> = ({ name, className = "", onClick }) => {
  const Svg = icons[name];

  return (
    <span
      className="inline-flex"
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <Svg className={className} />
    </span>
  );
};

export default Icon;