#!/usr/bin/env python3
"""Build a native-ABI seccomp filter, then exec bubblewrap with its private fd.
No fallback: missing libseccomp, unsupported ABI or rule errors stop the worker.
The filter is installed by bwrap after namespace/mount setup, before worker exec.
"""
import ctypes as C
import errno
import os
import platform
import sys

ALLOW=0x7fff0000
ERRNO=0x00050000
class Comparison(C.Structure):
    _fields_=[('arg',C.c_uint),('op',C.c_int),('datum_a',C.c_uint64),('datum_b',C.c_uint64)]

def filter_fd():
    if platform.machine() not in ('x86_64','aarch64'):raise RuntimeError('Unsupported seccomp architecture')
    lib=C.CDLL('libseccomp.so.2',use_errno=True)
    lib.seccomp_init.argtypes=[C.c_uint32];lib.seccomp_init.restype=C.c_void_p
    lib.seccomp_release.argtypes=[C.c_void_p];lib.seccomp_release.restype=None
    lib.seccomp_syscall_resolve_name.argtypes=[C.c_char_p];lib.seccomp_syscall_resolve_name.restype=C.c_int
    lib.seccomp_rule_add_array.argtypes=[C.c_void_p,C.c_uint32,C.c_int,C.c_uint,C.POINTER(Comparison)];lib.seccomp_rule_add_array.restype=C.c_int
    lib.seccomp_export_bpf.argtypes=[C.c_void_p,C.c_int];lib.seccomp_export_bpf.restype=C.c_int
    context=lib.seccomp_init(ALLOW)
    if not context:raise RuntimeError('Cannot initialize syscall filter')
    descriptor=None
    try:
        def deny(name,error=errno.EPERM,comparison=None):
            number=lib.seccomp_syscall_resolve_name(name.encode())
            if number<0:raise RuntimeError('Required syscall rule is unavailable: '+name)
            if lib.seccomp_rule_add_array(context,ERRNO|error,number,1 if comparison is not None else 0,C.byref(comparison) if comparison is not None else None)!=0:raise RuntimeError('Cannot add syscall rule: '+name)
        for name in ('unshare','setns','mount','umount2','pivot_root','ptrace','bpf','perf_event_open','keyctl','add_key','request_key','reboot','kexec_load','init_module','finit_module','delete_module','open_by_handle_at','move_mount','fsopen','fsconfig','fsmount','fspick','open_tree','userfaultfd','process_vm_readv','process_vm_writev'):
            deny(name)
        # io_uring is a large kernel attack surface; ENOSYS makes libuv/libc fall back
        # to ordinary syscalls instead of failing.
        for name in ('io_uring_setup','io_uring_enter','io_uring_register'):
            deny(name,errno.ENOSYS)
        # libc falls back to clone for normal threads/processes. Namespace flags
        # on clone are independently rejected, including future fallback callers.
        deny('clone3',errno.ENOSYS)
        for bit in (0x00020000,0x02000000,0x04000000,0x08000000,0x10000000,0x20000000,0x40000000):
            deny('clone',comparison=Comparison(0,7,bit,bit))
        descriptor=os.memfd_create('agentd-seccomp',os.MFD_CLOEXEC)
        if lib.seccomp_export_bpf(context,descriptor)!=0:raise RuntimeError('Cannot export syscall filter')
        os.lseek(descriptor,0,os.SEEK_SET);os.set_inheritable(descriptor,True)
        return descriptor
    except BaseException:
        if descriptor is not None:os.close(descriptor)
        raise
    finally:lib.seccomp_release(context)

def main():
    if len(sys.argv)<3 or not os.path.isabs(sys.argv[1]):raise RuntimeError('Absolute bubblewrap executable required')
    descriptor=filter_fd()
    try:os.execv(sys.argv[1],[sys.argv[1],'--seccomp',str(descriptor),*sys.argv[2:]])
    finally:os.close(descriptor)
if __name__=='__main__':
    try:main()
    except Exception:
        print('Worker syscall sandbox could not be established; execution refused.',file=sys.stderr);sys.exit(1)
