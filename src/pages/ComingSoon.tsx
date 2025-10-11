import { Link } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonProps {
  title: string;
  description?: string;
}

const ComingSoon = ({ title, description }: ComingSoonProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardContent className="p-12 text-center space-y-8">
          <div className="flex justify-center">
            <div className="p-6 bg-gray-100 rounded-full">
              <Construction className="w-20 h-20 text-gray-600" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              {title}
            </h1>
            <p className="text-xl text-gray-600">
              {description || "This module is currently under development"}
            </p>
            <p className="text-sm text-gray-500">
              We're working hard to bring you this feature. Check back soon!
            </p>
          </div>

          <Link to="/hub">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Hub
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoon;
