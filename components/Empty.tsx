import Sidebar from "@/components/Sidebar";

type EmptyProps = {
  messages: string;
};

const Empty = ({ messages }: EmptyProps) => {
  return (
    <div>
      <Sidebar />
      <div className="pl-[150px] pt-5 min-h-screen flex justify-center items-center">
        <p>{messages}</p>
      </div>
    </div>
  );
};

export default Empty;
