import Sidebar from "@/components/Sidebar";
import { Icon } from "@iconify/react";

const Loading = () => {
  return (
    <div>
      <Sidebar />
      <div className="pl-[150px] pt-5 min-h-screen flex justify-center items-center text-blue-500">
        <Icon icon="eos-icons:three-dots-loading" className="w-32 h-32" />
      </div>
    </div>
  );
};

export default Loading;
