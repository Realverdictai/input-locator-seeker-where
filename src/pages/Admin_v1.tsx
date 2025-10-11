
import AdminCsvImporter from "@/components/AdminCsvImporter";

const Admin = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        <AdminCsvImporter />
      </div>
    </div>
  );
};

export default Admin;
