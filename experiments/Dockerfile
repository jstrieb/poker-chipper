FROM debian:bookworm-slim

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
  pkg-config

WORKDIR /
RUN git clone https://github.com/emscripten-core/emsdk.git
WORKDIR /emsdk
RUN ./emsdk install 3.1.56 \
  && ./emsdk activate 3.1.56 \
  && echo '. "/emsdk/emsdk_env.sh"' >> /root/.bashrc

ENV PATH="/emsdk:/emsdk/upstream/emscripten:${PATH}"

WORKDIR /
RUN curl 'https://scipopt.org/download/release/scipoptsuite-8.1.0.tgz' | tar -xvz

WORKDIR /scipoptsuite-8.1.0
ENV CXXFLAGS="-sINVOKE_RUN=0 -sFILESYSTEM=1 -sFORCE_FILESYSTEM=1 -sMODULARIZE=1 -sEXPORT_NAME=createSCIP -sEXPORTED_RUNTIME_METHODS=FS,callMain -sEXPORT_ES6=1 -sWASM=2 -sEXCEPTION_STACK_TRACES=1 -sDISABLE_EXCEPTION_CATCHING=0"
RUN mkdir build \
  && cd build \
  && emcmake cmake .. -DNO_EXTERNAL_CODE=on -DBUILD_TESTING=off \
  && make -j

CMD ["sleep", "infinity"]
