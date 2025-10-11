import { Link } from "react-router-dom";
import { Scale, Briefcase, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Hub = () => {
  const modules = [
    {
      title: "Personal Injury",
      description: "Case evaluation and settlement analysis",
      icon: Scale,
      path: "/",
      available: true,
    },
    {
      title: "Workers' Comp",
      description: "Coming soon",
      icon: Briefcase,
      path: "/wc_coming_soon",
      available: false,
    },
    {
      title: "Divorce",
      description: "Coming soon",
      icon: Heart,
      path: "/divorce_coming_soon",
      available: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Verdict AI — Virtual Mediator Hub
          </h1>
          <p className="text-xl text-gray-600">
            Select your practice area to begin
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link 
                key={module.title} 
                to={module.path}
                className={!module.available ? "pointer-events-none" : ""}
              >
                <Card className={`h-full transition-all duration-300 ${
                  module.available 
                    ? "hover:shadow-2xl hover:-translate-y-2 cursor-pointer" 
                    : "opacity-60"
                }`}>
                  <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                    <div className={`p-6 rounded-full ${
                      module.available 
                        ? "bg-blue-600" 
                        : "bg-gray-400"
                    }`}>
                      <Icon className="w-12 h-12 text-white" />
                    </div>
                    
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {module.title}
                      </h2>
                      <p className={`text-sm ${
                        module.available ? "text-gray-600" : "text-gray-500"
                      }`}>
                        {module.description}
                      </p>
                    </div>

                    <Button 
                      className={`w-full ${
                        module.available 
                          ? "bg-blue-600 hover:bg-blue-700" 
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      disabled={!module.available}
                    >
                      {module.available ? "Enter" : "Coming Soon"}
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Hub;
