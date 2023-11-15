"###############################################################################
"# Bootstrap
"###############################################################################

" UTF-8 all the things
set encoding=utf-8
set fileencoding=utf-8

"###############################################################################
"# General settings
"###############################################################################

" Code syntax coloring for files
syntax on

" Use the indentation from the previous line
set autoindent

" Set highlight for search
set hlsearch

" Case-insensitive searching
set ignorecase

" But case-sensitive if expression contains a capital letter
set smartcase

" Show line numbers
set number

" Set the title at top of tab to be the filename
set title

" Highlight current line
"set cursorline

" Highlight column 80
set colorcolumn=80
set linebreak

" Display status bar
set laststatus=2

" Enable mouse in all modes because why not
set mouse=a

" Display line number, the column number, the virtual column number, and the
" relative position of the cursor in the file (as a percentage)
set ruler

"###############################################################################
"# File-type specific
"###############################################################################

" Limits the body of Git commit messages to 72 characters
"autocmd Filetype gitcommit spell textwidth=72

" Enable spell checking on certain file types
autocmd BufRead,BufNewFile *.md,gitcommit setlocal spell complete+=kspell

"###############################################################################
"# Theming
"###############################################################################

" Available schemes are in `/usr/share/vim/vim80/colors`.
" Custom schemes can be installed in `~/.vim/colors`.
" Schemes website: https://vimcolors.com/

" Define color scheme.
let base16colorspace=256
"colorscheme sidonia

" Enable italic text
"highlight Comment cterm=italic

" Display current line number in bold text
"highlight CursorLineNr cterm=bold

" Set hidden characters colors to light gray
highlight NonText ctermfg=187
highlight SpecialKey ctermfg=187

" Fixes non-functional arrow keys when using ConEmu
set term=builtin_ansi
