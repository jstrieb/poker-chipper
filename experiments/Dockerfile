FROM debian:latest

RUN apt-get update \
  && apt-get install -y \
  python3 \
  python3-pip \
  cmake \
  git \
  curl \
  zip \
  unzip \
  tar \
  automake \
  autoconf \
  libtool \
  pkg-config \
  neovim \
  less \
  wget

WORKDIR /
RUN git clone https://github.com/emscripten-core/emsdk.git
WORKDIR /emsdk
RUN ./emsdk install latest \
  && ./emsdk activate latest \
  && echo '. "/emsdk/emsdk_env.sh"' >> /root/.bashrc

ENV PATH="/emsdk:/emsdk/upstream/emscripten:${PATH}"

# WORKDIR /
# RUN git clone https://github.com/Microsoft/vcpkg.git
# WORKDIR /vcpkg
# RUN ./bootstrap-vcpkg.sh -disableMetrics
# ENV PATH="${PATH}:/vcpkg"

# WORKDIR /
# RUN wget 'https://gmplib.org/download/gmp/gmp-6.3.0.tar.lz' \
  # && tar -xvJf gmp-6.3.0.tar.lz
# WORKDIR /gmp-6.3.0
# RUN ./configure \
  # && make -j
# RUN emconfigure ./configure --disable-assembly --host none --enable-cxx \
  # && sed -i'.bak' 's/#define GMP_LIMB_BITS[ \t]*32/#define GMP_LIMB_BITS 64/g' 'gmp.h' \
  # && emmake make -j \
  # && emmake make install

WORKDIR /
RUN curl -o 'scipoptsuite-8.1.0.tgz' 'https://scipopt.org/download/release/scipoptsuite-8.1.0.tgz' \
  && tar -xvzf scipoptsuite-8.1.0.tgz

WORKDIR /scipoptsuite-8.1.0
# RUN vcpkg install gmp:wasm32-emscripten
RUN mkdir build \
  && cd build \
  && emcmake cmake .. -DNO_EXTERNAL_CODE=on -DBUILD_TESTING=off \
  && make -j

