export function LogoGrupo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Avapex */}
      <div className="flex items-center gap-1">
        <span className="text-lg font-black tracking-tight text-foreground">
          AVAPEX
        </span>
        <span className="text-accent text-xl font-bold">»</span>
      </div>
      
      <div className="h-6 w-px bg-border" />
      
      {/* Seday */}
      <div className="flex items-center">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-xs">
          S
        </div>
        <span className="ml-1 text-sm font-bold text-primary uppercase tracking-wide">
          Seday
        </span>
      </div>
      
      <div className="h-6 w-px bg-border" />
      
      {/* Innomach */}
      <div className="flex flex-col leading-none">
        <span className="text-[8px] text-muted-foreground">Innovation in Machines</span>
        <span className="text-lg font-black">
          <span className="text-destructive">INO</span>
          <span className="text-foreground">MACH</span>
        </span>
      </div>
    </div>
  );
}
