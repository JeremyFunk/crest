/**
 * This file contains the meta code for the pseudo-asm compiler.
 * 
 * This includes the following:
 * - The start routine
 * - The end routine
 * - The data section
 */

export type PseudoMetaType =
    'header' |
    'program_start' |
    'program_end' |
    'data_section'


export function getPseudoMeta(type: PseudoMetaType) {
    switch(type) {
        case 'program_start':
            return 'program_start';
        case 'program_end':
            return 'program_end';
        case 'data_section':
            return 'data_section';
        case 'header':
            return 'header';
    }
}