#include <stdio.h>

int main() {
    FILE *ptr;
    char buf[2048];
    int len = 0;
    ptr = fopen("./data/static.out", "r");
    len = fread(buf, 1, 2048, ptr);
    buf[len] = 0;
    fclose(ptr);
    printf("%s", buf);
    return 0;
}
