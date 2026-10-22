add_cus_dep('glo', 'gls', 0, 'makeglo');
sub makeglo {
    my ($base) = @_;
    return system("makeindex -s tcc-glossary.ist -o \"$base.gls\" \"$base.glo\"");
}