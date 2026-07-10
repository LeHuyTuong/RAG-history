import { create } from 'zustand';

const useModalStore = create((set) => ({
  isOpen: false,
  modalType: '', // 'delete', 'confirm', etc.
  modalData: null,
  
  openModal: (type, data = null) => set({ isOpen: true, modalType: type, modalData: data }),
  closeModal: () => set({ isOpen: false, modalType: '', modalData: null }),
}));

export default useModalStore;
