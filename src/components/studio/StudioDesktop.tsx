import dynamic from "next/dynamic";

const ViewerCount = dynamic(() => import("~/components/studio/ViewerCount"));
const LiveIndicator = dynamic(
  () => import("~/components/studio/LiveIndicator")
);

const StudioDesktop = () => {
  return <div>StudioDesktop</div>;
};

export default StudioDesktop;
