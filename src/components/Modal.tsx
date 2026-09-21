"use client";

import type { ReactNode } from "react";

type ModalProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {

}