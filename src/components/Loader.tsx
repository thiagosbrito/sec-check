'use client'
import React from 'react'
import AnimatedView from './AnimatedView'
import * as LoaderAnimation from '@/lib/animations/loader.json'
import { motion } from 'framer-motion'
import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { springs, durations } from '@/lib/animations'

export default function Loader() {

    // Fade + scale variants for overlay and content
    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
    }

    const contentVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
    }

    // Use valid easing preset names for Framer Motion typing
    const fadeTransition = durations.fast
    const contentTransition = {
        opacity: durations.fast,
        scale: springs.gentle,
    }

    return (
        <motion.div
            className="w-full h-full flex items-center justify-center"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={fadeTransition}
        >
            <motion.div variants={contentVariants} transition={contentTransition}>
                <AnimatedView
                    animationData={LoaderAnimation}
                    height={128}
                    width={128}
                />
            </motion.div>
        </motion.div>
    )
}