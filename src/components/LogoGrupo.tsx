import logoGrupo from "@/assets/grupo-seday-logo.png.asset.json";

interface LogoGrupoProps {
  className?: string;
  imgClassName?: string;
}

export function LogoGrupo({ className = "", imgClassName = "h-20 w-auto" }: LogoGrupoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoGrupo.url}
        alt="Grupo Seday - Avapex Transportes, Seday Equipamentos, Innomach"
        className={imgClassName}
        loading="lazy"
      />
    </div>
  );
}
