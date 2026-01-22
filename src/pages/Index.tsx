import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 animate-slide-up">
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-2xl gradient-primary shadow-elevated">
          <Clock className="h-10 w-10 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Controle de Horas Extras
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Grupo Seday - Avapex, Seday, Innomach
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={() => navigate("/login")}
          className="px-8"
        >
          Acessar Sistema
        </Button>
      </div>
    </div>
  );
};

export default Index;
