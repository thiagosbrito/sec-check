'use client';

import Lottie, { Options } from "react-lottie";

export default function AnimatedView({ animationData, height, width }: { animationData: Options['animationData'], height?: number, width?: number}) {
    const options: Options = {
        animationData: JSON.parse(JSON.stringify(animationData)),
        loop: true,
        autoplay: true,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    return <Lottie options={options} height={height} width={width} />;
}