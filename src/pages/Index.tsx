import { MagneticSeparatorCalculator } from "@/components/MagneticSeparatorCalculator";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BarChart3 } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Magnetic Separator Calculator</h1>
          <div className="flex gap-2">
            <Link to="/pcb-chat">
              <Button variant="outline">
                Decision Tree
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
        <MagneticSeparatorCalculator />
      </div>
    </div>
  );
};

export default Index;
