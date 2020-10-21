#ifndef __NODE_MAPNIK_LOGGER_H__
#define __NODE_MAPNIK_LOGGER_H__

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wunused-parameter"
#pragma GCC diagnostic ignored "-Wshadow"
#pragma GCC diagnostic ignored "-Wcast-function-type"
#include <nan.h>
#pragma GCC diagnostic pop

//Forward declaration of mapnik logger
namespace mapnik { class logger; }

class Logger: public Nan::ObjectWrap {
public:
    // V8 way of...
    static Nan::Persistent<v8::FunctionTemplate> constructor;

    // Initialize function is needed for all addons
    static void Initialize(v8::Local<v8::Object> target);

    // Nan_Method when new Logger object is instantiated
    static NAN_METHOD(New);

    // Get and set functions
    // Are these the only methods available in logger?
    static NAN_METHOD(get_severity);
    static NAN_METHOD(set_severity);
    static NAN_METHOD(evoke_error);

private:
    // Default Constructor
    Logger();
    // Deconstructor
    ~Logger();
};

#endif
