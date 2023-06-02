import dynamic from "next/dynamic";

const ViewerCount = dynamic(() => import("~/components/studio/ViewerCount"));
const LiveIndicator = dynamic(
  () => import("~/components/studio/LiveIndicator")
);

const StudioMobile = () => {
  return <div>StudioMobile</div>;
};

export default StudioMobile;
